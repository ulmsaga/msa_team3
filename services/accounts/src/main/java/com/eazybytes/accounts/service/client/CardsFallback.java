package com.eazybytes.accounts.service.client;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.eazybytes.accounts.dto.CardsDto;
import com.eazybytes.accounts.service.CardsFallbackMessageListener;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CardsFallback implements CardsFeignClient {

    private final KafkaTemplate<String, String> kafkaTemplate;

    private final RabbitTemplate rabbitTemplate;

    public CardsFallback(RabbitTemplate rabbitTemplate, KafkaTemplate<String, String> kafkaTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public ResponseEntity<CardsDto> fetchCardDetails(String correlationId, String mobileNumber) {
        
        String fallbackMessage = String.format("Cards service is down! CorrelationId: %s, MobileNumber: %s", correlationId, mobileNumber);

        // KAFKA로 대체 로직을 보내는 코드
        log.info("[KafkaTemplate] Cards Fallback Send: {}", fallbackMessage);
        kafkaTemplate.send(CardsFallbackMessageListener.CARD_CALLBACK_TOPIC, fallbackMessage);

        // RabbitMQ로 대체 로직을 보내는 코드
        log.info("[RabbitTemplate] Cards Fallback Send: {}", fallbackMessage);
        rabbitTemplate.convertAndSend(CardsFallbackMessageListener.CARD_CALLBACK_QUEUE, fallbackMessage);
        
        return ResponseEntity.ok(new CardsDto());
    }
}
