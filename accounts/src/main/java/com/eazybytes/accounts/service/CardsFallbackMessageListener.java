package com.eazybytes.accounts.service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.eazybytes.accounts.dto.FallbackMessageDto;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CardsFallbackMessageListener {

    private final EventEmitter eventEmitter;
    public static final String CARD_CALLBACK_QUEUE = "cards-fallback-queue";
    public static final String CARD_CALLBACK_TOPIC = "cards-fallback-topic";
    private final String CARD_CALLBACK_GROUP = "accounts-group";

    public CardsFallbackMessageListener(EventEmitter eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    
    @KafkaListener(topics = CARD_CALLBACK_TOPIC, groupId = CARD_CALLBACK_GROUP)
    public void listenCardsFailureMessages(String message) {
        log.info("[KafkaListener] Cards Fallback Message :: {}", message);
        
        // 여기서 Cards 서비스 장애 시의 대체 로직을 구현
        FallbackMessageDto fallbackMessageDto = new FallbackMessageDto();
        fallbackMessageDto.setFallbackMessage(message);
        fallbackMessageDto.setCorrelationId(extractCorrelationId(message));
        fallbackMessageDto.setMobileNumber(extractMobileNumber(message));
        List<FallbackMessageDto> fallbackMessageList = List.of(fallbackMessageDto);
        eventEmitter.sendData(fallbackMessageList, CARD_CALLBACK_TOPIC);
    }

    @RabbitListener(queues = CARD_CALLBACK_QUEUE)
    public void handleCardsFallback(String message) {
        log.info("[RabbitListener] Cards Fallback Message :: {}", message);
        
        // 여기서 Cards 서비스 장애 시의 대체 로직을 구현
        FallbackMessageDto fallbackMessageDto = new FallbackMessageDto();
        fallbackMessageDto.setFallbackMessage(message);
        fallbackMessageDto.setCorrelationId(extractCorrelationId(message));
        fallbackMessageDto.setMobileNumber(extractMobileNumber(message));
        List<FallbackMessageDto> fallbackMessageList = List.of(fallbackMessageDto);
        eventEmitter.sendData(fallbackMessageList, CARD_CALLBACK_QUEUE);
    }

    private String extractCorrelationId(String message) {
        Pattern pattern = Pattern.compile("CorrelationId: (\\w+)");
        Matcher matcher = pattern.matcher(message);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String extractMobileNumber(String message) {
        Pattern pattern = Pattern.compile("MobileNumber: (\\d+)");
        Matcher matcher = pattern.matcher(message);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
}
