package com.eazybytes.accounts.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue loansQueue() {
        return new Queue("loans-fallback-queue", true);
    }

    @Bean
    public Queue cardsQueue() {
        return new Queue("cards-fallback-queue", true);
    }
}
