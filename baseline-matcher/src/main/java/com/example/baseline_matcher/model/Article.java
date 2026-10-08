package com.example.baseline_matcher.model;

import java.util.List;

public class Article {

    private Long id;
    private String title;
    private String department;
    private List<String> tags;
    private String body;

    public Article() {
    }

    public Article(
            Long id,
            String title,
            String department,
            List<String> tags,
            String body
    ) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.tags = tags;
        this.body = body;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}