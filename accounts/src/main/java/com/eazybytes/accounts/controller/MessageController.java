package com.eazybytes.accounts.controller;

import java.net.InetAddress;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.eazybytes.accounts.service.CardsFallbackMessageListener;
import com.eazybytes.accounts.service.EventEmitter;
import com.eazybytes.accounts.service.LoansFallbackMessageListener;

@RestController
public class MessageController {
  
  private final CardsFallbackMessageListener cardsFallbackMessageListener;
  private final LoansFallbackMessageListener loansFallbackMessageListener;

  private final EventEmitter eventEmitter;
  private final long SSE_SESSION_TIMEOUT = 30 * 60 * 1000L;

  // 생성자
  public MessageController(EventEmitter eventEmitter, CardsFallbackMessageListener cardsFallbackMessageListener, LoansFallbackMessageListener loansFallbackMessageListener) {
    this.eventEmitter = eventEmitter;
    this.cardsFallbackMessageListener = cardsFallbackMessageListener;
    this.loansFallbackMessageListener = loansFallbackMessageListener; 
  }

  @GetMapping(value = "/subscribe", produces=org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
  public ResponseEntity<SseEmitter> subscribe() {
    SseEmitter emitter = new SseEmitter(SSE_SESSION_TIMEOUT);
    eventEmitter.add(emitter);
    eventEmitter.connectAndSendExistData(emitter, EventEmitter.DEFAULT_EVENT_NAME);
    return ResponseEntity.ok(emitter);
  }

  @GetMapping("/getHostName")
    public ResponseEntity<String> getHostName() {
         String hostName = "";
        try {
                hostName = InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
                throw new RuntimeException("Error while fetching hostname");
        }
        return ResponseEntity.status(HttpStatus.OK).body(hostName);
    }
}
