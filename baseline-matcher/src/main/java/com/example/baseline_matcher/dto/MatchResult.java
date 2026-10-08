package com.example.baseline_matcher.dto;

public class MatchResult {
    private Long articleId;
    private String title;
    private double matchScore;
    private String body;

    public MatchResult(Long articleId, String title, double matchScore, String body) {
        this.articleId = articleId;
        this.title = title;
        this.matchScore = matchScore;
        this.body = body;
    }

    public Long getArticleId() { return articleId; }
    public String getTitle() { return title; }
    public double getMatchScore() { return matchScore; }
    public String getBody() { return body; }
}
