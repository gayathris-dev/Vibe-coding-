package com.example.baseline_matcher.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.example.baseline_matcher.dto.MatchResult;
import com.example.baseline_matcher.model.Article;

@Service
public class BaselineMatcher {
    private final EmbeddingService embeddingService;
    private final Map<Long, List<Double>> articleEmbeddings = new HashMap<>();

    public BaselineMatcher(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    public MatchResult findBestMatch(
            String ticketDescription,
            String department,
            List<Article> articles
    ) {
        List<Article> relevantArticles = articles.stream()
                .filter(article ->
                        article.getDepartment() != null &&
                        article.getDepartment().equalsIgnoreCase(department)
                )
                .toList();

        if (relevantArticles.isEmpty()) {
            throw new RuntimeException(
                    "No articles found for department: " + department
            );
        }

        List<Double> ticketEmbedding =
                embeddingService.getEmbedding(ticketDescription);

        Article bestArticle = null;
        double bestSimilarity = -1.0;

        for (Article article : relevantArticles) {
            List<Double> articleEmbedding =
                    articleEmbeddings.get(article.getId());

            if (articleEmbedding == null) {
                String articleText =
                        "Title: " + article.getTitle() + ". " +
                        "Department: " + article.getDepartment() + ". " +
                        "Tags: " + String.join(", ", article.getTags()) + ". " +
                        "Procedure: " + article.getBody();

                articleEmbedding =
                        embeddingService.getEmbedding(articleText);

                articleEmbeddings.put(article.getId(), articleEmbedding);
            }

            double similarity =
                    cosineSimilarity(ticketEmbedding, articleEmbedding);

            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestArticle = article;
            }
        }

        if (bestArticle == null) {
            throw new RuntimeException("No matching article found");
        }

        double score = bestSimilarity * 100.0;

        return new MatchResult(
                bestArticle.getId(),
                bestArticle.getTitle(),
                score,
                bestArticle.getBody()
        );
    }

    private double cosineSimilarity(
            List<Double> vectorA,
            List<Double> vectorB
    ) {
        if (vectorA.size() != vectorB.size()) {
            throw new IllegalArgumentException(
                    "Embedding dimensions do not match"
            );
        }

        double dotProduct = 0.0;
        double magnitudeA = 0.0;
        double magnitudeB = 0.0;

        for (int i = 0; i < vectorA.size(); i++) {
            double a = vectorA.get(i);
            double b = vectorB.get(i);

            dotProduct += a * b;
            magnitudeA += a * a;
            magnitudeB += b * b;
        }

        if (magnitudeA == 0.0 || magnitudeB == 0.0) {
            return 0.0;
        }

        return dotProduct /
                (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }
}
