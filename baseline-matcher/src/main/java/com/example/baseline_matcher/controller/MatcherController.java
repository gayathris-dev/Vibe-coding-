package com.example.baseline_matcher.controller;

import com.example.baseline_matcher.dto.MatchResult;
import com.example.baseline_matcher.dto.TicketRequest;
import com.example.baseline_matcher.model.Article;
import com.example.baseline_matcher.service.ArticleService;
import com.example.baseline_matcher.service.BaselineMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MatcherController {
    private final ArticleService articleService;
    private final BaselineMatcher baselineMatcher;

    public MatcherController(ArticleService articleService, BaselineMatcher baselineMatcher) {
        this.articleService = articleService;
        this.baselineMatcher = baselineMatcher;
    }

    @PostMapping("/match")
    public MatchResult matchTicket(@RequestBody TicketRequest request) {
        if (request == null || request.getDescription() == null ||
                request.getDescription().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ticket description cannot be empty"
            );
        }

        if (request.getDepartment() == null ||
                request.getDepartment().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Department cannot be empty"
            );
        }

        List<Article> articles = articleService.getArticles();

        return baselineMatcher.findBestMatch(
                request.getDescription().trim(),
                request.getDepartment().trim(),
                articles
        );
    }
}
