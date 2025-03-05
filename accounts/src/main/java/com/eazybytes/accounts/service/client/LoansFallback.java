package com.eazybytes.accounts.service.client;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.eazybytes.accounts.dto.LoansDto;
import com.eazybytes.accounts.service.LoansFallbackMessageListener;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class LoansFallback implements LoansFeignClient {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final RabbitTemplate rabbitTemplate;

    public LoansFallback(RabbitTemplate rabbitTemplate, KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public ResponseEntity<LoansDto> fetchLoanDetails(String correlationId, String mobileNumber) {
        
        String fallbackMessage = String.format("Fallback triggered for MobileNumber: %s, CorrelationId: %s", mobileNumber, correlationId);

        // KAFAK로 대체 로직을 보내는 코드
        log.info("[KafkaTemplate] Loans Fallback Send: {}", fallbackMessage);
        kafkaTemplate.send(LoansFallbackMessageListener.LOAN_CALLBACK_TOPIC, fallbackMessage);

        // RabbitMQ로 대체 로직을 보내는 코드
        log.info("[RabbitTemplate] Loans Fallback Send: {}", fallbackMessage);
        rabbitTemplate.convertAndSend(LoansFallbackMessageListener.LOAN_CALLBACK_QUEUE, fallbackMessage);

        return ResponseEntity.ok(new LoansDto());
    }
}
