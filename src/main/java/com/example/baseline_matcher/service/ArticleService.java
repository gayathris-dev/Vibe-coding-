package com.example.baseline_matcher.service;

import com.example.baseline_matcher.model.Article;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class ArticleService {

    public List<Article> getArticles() {

        try {

            ObjectMapper objectMapper = new ObjectMapper();

            ClassPathResource resource =
                    new ClassPathResource("articles.json");

            InputStream inputStream =
                    resource.getInputStream();

            return objectMapper.readValue(
                    inputStream,
                    new TypeReference<List<Article>>() {}
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to load articles.json",
                    e
            );
        }
    }
}