package com.bnp.kbimporter;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.bnp.kbimporter.importer.KnowledgeBaseImporter;
import com.bnp.kbimporter.model.ParsedArticle;
import com.bnp.kbimporter.parser.MarkdownParser;
import com.bnp.kbimporter.result.ImportResult;
import com.bnp.kbimporter.scanner.KnowledgeBaseScanner;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

public class Main {

    private static final Pattern ID_PATTERN =
            Pattern.compile("\"id\"\\s*:\\s*(\\d+)");

    private static final Pattern DEPARTMENT_PATTERN =
            Pattern.compile("\"department\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

    private static final Pattern DESCRIPTION_PATTERN =
            Pattern.compile("\"description\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

    public static void main(String[] args) throws Exception {

        Path knowledgeBasePath = knowledgeBasePath();

        if (!Files.exists(knowledgeBasePath)) {
            throw new IllegalStateException(
                    "Knowledge Base directory not found: "
                            + knowledgeBasePath.toAbsolutePath()
            );
        }

        if (!Files.isDirectory(knowledgeBasePath)) {
            throw new IllegalStateException(
                    "Knowledge Base path is not a directory: "
                            + knowledgeBasePath.toAbsolutePath()
            );
        }

        int port = Integer.parseInt(
                System.getenv().getOrDefault("API_PORT", "8080")
        );

        HttpServer server = HttpServer.create(
                new InetSocketAddress(port),
                0
        );

        server.createContext("/api/process", Main::handleProcessRequest);

        server.setExecutor(null);

        System.out.println();
        System.out.println("==========================================");
        System.out.println("       BNP KNOWLEDGE BASE API");
        System.out.println("==========================================");
        System.out.println("Knowledge Base : " + knowledgeBasePath.toAbsolutePath());
        System.out.println("API            : http://localhost:" + port + "/api/process");
        System.out.println();
        System.out.println("Expected request:");
        System.out.println("{");
        System.out.println("  \"id\": 64,");
        System.out.println("  \"department\": \"Retail_Banking\",");
        System.out.println("  \"description\": \"Verify the user's identity and entitlement in the Corporate portal and apply the configuration change\"");
        System.out.println("}");
        System.out.println();
        System.out.println("==========================================");

        server.start();

        System.out.println("Server started successfully.");
        System.out.println("Waiting for requests...");
        System.out.println();
    }

    private static void handleProcessRequest(HttpExchange exchange) throws IOException {

        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendResponse(
                    exchange,
                    405,
                    "{\"error\":\"Only POST is allowed\"}"
            );
            return;
        }

        String requestBody = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );

        System.out.println();
        System.out.println("==========================================");
        System.out.println("REQUEST RECEIVED");
        System.out.println("==========================================");
        System.out.println(requestBody);

        int ticketId = extractId(requestBody);
        String department = extractDepartment(requestBody);
        String description = extractDescription(requestBody);

        System.out.println();
        System.out.println("Ticket ID   : " + ticketId);
        System.out.println("Department  : " + department);
        System.out.println("Description : " + description);

        if (department == null || department.isBlank()) {
            sendResponse(
                    exchange,
                    400,
                    "{\"error\":\"department is required\"}"
            );
            return;
        }

        if (description == null || description.isBlank()) {
            sendResponse(
                    exchange,
                    400,
                    "{\"error\":\"description is required\"}"
            );
            return;
        }

        System.out.println();
        System.out.println("==========================================");
        System.out.println("KNOWLEDGE BASE IMPORT");
        System.out.println("==========================================");

        KnowledgeBaseImporter importer =
                new KnowledgeBaseImporter(
                        new KnowledgeBaseScanner(),
                        new MarkdownParser()
                );

        ImportResult result = importer.parseAll(
                knowledgeBasePath()
        );

        System.out.println(
                "Files discovered : " + result.filesDiscovered()
        );

        System.out.println(
                "Articles parsed  : " + result.articlesParsed()
        );

        System.out.println(
                "Parse failures   : " + result.failed()
        );

        System.out.println(
                "Departments      : " + result.departments()
        );

        /*
         * IMPORTANT:
         *
         * The incoming request may contain:
         *
         *     Corporate Banking
         *
         * while the KB uses:
         *
         *     Corporate_Banking
         *
         * Therefore both values are normalized before comparison.
         */
        String normalizedRequestedDepartment =
                normalizeDepartment(department);

        List<ParsedArticle> departmentArticles =
                result.articles()
                        .stream()
                        .filter(article ->
                                normalizedRequestedDepartment.equals(
                                        normalizeDepartment(article.department())
                                )
                        )
                        .collect(Collectors.toList());

        System.out.println();
        System.out.println(
                "Articles in [" + department + "] : "
                        + departmentArticles.size()
        );

        /*
         * Generate articles.json containing ALL articles
         * belonging to the requested department.
         *
         * This allows the baseline matcher to compare
         * the ticket against multiple candidate articles.
         */
        Path matcherArticlesPath = getMatcherArticlesPath();

        String articlesJson =
                buildArticlesJson(
                        departmentArticles,
                        description
                );

        Path parent = matcherArticlesPath.getParent();

        if (parent != null) {
            Files.createDirectories(parent);
        }

        Files.writeString(
                matcherArticlesPath,
                articlesJson,
                StandardCharsets.UTF_8
        );

        System.out.println();
        System.out.println("==========================================");
        System.out.println("ARTICLES JSON GENERATED");
        System.out.println("==========================================");

        System.out.println(
                "Output file : "
                        + matcherArticlesPath.toAbsolutePath()
        );

        System.out.println(
                "Article count : "
                        + departmentArticles.size()
        );

        /*
         * Build API response.
         */
        String response =
                "{\n" +
                "  \"ticketId\": " + ticketId + ",\n" +
                "  \"department\": \"" +
                        escapeJson(department) + "\",\n" +
                "  \"normalizedDepartment\": \"" +
                        escapeJson(normalizedRequestedDepartment) + "\",\n" +
                "  \"description\": \"" +
                        escapeJson(description) + "\",\n" +
                "  \"filesDiscovered\": " +
                        result.filesDiscovered() + ",\n" +
                "  \"articlesParsed\": " +
                        result.articlesParsed() + ",\n" +
                "  \"parseFailures\": " +
                        result.failed() + ",\n" +
                "  \"articleCount\": " +
                        departmentArticles.size() + ",\n" +
                "  \"articlesJsonFile\": \"" +
                        escapeJson(
                                matcherArticlesPath
                                        .toAbsolutePath()
                                        .toString()
                        ) +
                        "\"\n" +
                "}";

        sendResponse(
                exchange,
                200,
                response
        );
    }

    /**
     * Normalize department names so that:
     *
     * Corporate Banking
     * Corporate_Banking
     * corporate banking
     * corporate_banking
     * Corporate-Banking
     *
     * all become:
     *
     * corporate_banking
     */
    private static String normalizeDepartment(String department) {

        if (department == null) {
            return "";
        }

        return department
                .trim()
                .replace('-', '_')
                .replace(' ', '_')
                .replaceAll("_+", "_")
                .toLowerCase();
    }

    private static Path knowledgeBasePath() {

        String configuredPath =
                System.getenv("KB_PATH");

        if (configuredPath != null &&
                !configuredPath.isBlank()) {

            return Path.of(configuredPath)
                    .toAbsolutePath()
                    .normalize();
        }

        return Path.of("knowledge_base")
                .toAbsolutePath()
                .normalize();
    }

    private static Path getMatcherArticlesPath() {

        String configuredPath =
                System.getenv("MATCHER_ARTICLES_JSON");

        if (configuredPath != null &&
                !configuredPath.isBlank()) {

            return Path.of(configuredPath)
                    .toAbsolutePath()
                    .normalize();
        }

        /*
         * When running from:
         *
         * Branch/kb-importer
         *
         * this resolves to:
         *
         * Branch/baseline-matcher/src/main/resources/articles.json
         */
        return Path.of(
                "..",
                "baseline-matcher",
                "src",
                "main",
                "resources",
                "articles.json"
        ).toAbsolutePath().normalize();
    }

    private static String buildArticlesJson(
            List<ParsedArticle> articles,
            String ticketDescription
    ) {

        StringBuilder json = new StringBuilder();

        json.append("[\n");

        for (int i = 0; i < articles.size(); i++) {

            ParsedArticle article = articles.get(i);

            /*
             * Generate tags from the ticket description.
             */
            List<String> generatedTags =
                    extractTags(ticketDescription);

            /*
             * Add the original article tags as well.
             */
            List<String> allTags =
                    new ArrayList<>();

            if (generatedTags != null) {
                allTags.addAll(generatedTags);
            }

            if (article.tags() != null) {
                allTags.addAll(article.tags());
            }

            /*
             * Remove duplicates while preserving order.
             */
            List<String> uniqueTags =
                    new ArrayList<>(
                            new HashSet<>(allTags)
                    );

            json.append("  {\n");

            json.append(
                    "    \"id\": "
                            + (i + 1)
                            + ",\n"
            );

            json.append(
                    "    \"title\": \""
                            + escapeJson(article.title())
                            + "\",\n"
            );

            json.append(
                    "    \"department\": \""
                            + escapeJson(article.department())
                            + "\",\n"
            );

            json.append(
                    "    \"tags\": "
                            + tagsToJson(uniqueTags)
                            + ",\n"
            );

            json.append(
                    "    \"body\": \""
                            + escapeJson(article.bodyText())
                            + "\"\n"
            );

            json.append("  }");

            if (i < articles.size() - 1) {
                json.append(",");
            }

            json.append("\n");
        }

        json.append("]\n");

        return json.toString();
    }

    private static List<String> extractTags(
            String description
    ) {

        if (description == null ||
                description.isBlank()) {

            return List.of();
        }

        String cleaned =
                description
                        .toLowerCase()
                        .replaceAll(
                                "[^a-z0-9 ]",
                                " "
                        );

        Set<String> stopWords =
                new HashSet<>(
                        Arrays.asList(
                                "the",
                                "and",
                                "or",
                                "a",
                                "an",
                                "to",
                                "of",
                                "in",
                                "on",
                                "for",
                                "with",
                                "is",
                                "are",
                                "this",
                                "that",
                                "user",
                                "apply",
                                "verify"
                        )
                );

        return Arrays.stream(
                        cleaned
                                .split("\\s+")
                )
                .filter(word ->
                        !word.isBlank()
                )
                .filter(word ->
                        word.length() > 2
                )
                .filter(word ->
                        !stopWords.contains(word)
                )
                .distinct()
                .collect(Collectors.toList());
    }

    private static String tagsToJson(
            List<String> tags
    ) {

        StringBuilder json =
                new StringBuilder("[");

        for (int i = 0; i < tags.size(); i++) {

            json.append("\"")
                    .append(
                            escapeJson(tags.get(i))
                    )
                    .append("\"");

            if (i < tags.size() - 1) {
                json.append(", ");
            }
        }

        json.append("]");

        return json.toString();
    }

    private static int extractId(
            String json
    ) {

        Matcher matcher =
                ID_PATTERN.matcher(json);

        if (matcher.find()) {

            try {
                return Integer.parseInt(
                        matcher.group(1)
                );
            } catch (NumberFormatException ignored) {
            }
        }

        return 0;
    }

    private static String extractDepartment(
            String json
    ) {

        Matcher matcher =
                DEPARTMENT_PATTERN.matcher(json);

        if (matcher.find()) {
            return unescapeJson(
                    matcher.group(1)
            );
        }

        return "";
    }

    private static String extractDescription(
            String json
    ) {

        Matcher matcher =
                DESCRIPTION_PATTERN.matcher(json);

        if (matcher.find()) {
            return unescapeJson(
                    matcher.group(1)
            );
        }

        return "";
    }

    private static String unescapeJson(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }

    private static String escapeJson(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }

    private static void sendResponse(
            HttpExchange exchange,
            int statusCode,
            String response
    ) throws IOException {

        byte[] responseBytes =
                response.getBytes(
                        StandardCharsets.UTF_8
                );

        exchange.getResponseHeaders()
                .set(
                        "Content-Type",
                        "application/json; charset=UTF-8"
                );

        exchange.sendResponseHeaders(
                statusCode,
                responseBytes.length
        );

        try (OutputStream outputStream =
                     exchange.getResponseBody()) {

            outputStream.write(responseBytes);
        }
    }
}