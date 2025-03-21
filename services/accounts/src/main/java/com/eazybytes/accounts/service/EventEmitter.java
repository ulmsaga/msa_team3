package com.eazybytes.accounts.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class EventEmitter extends SseEmitter {

  private final List<SseEmitter> emitterList = new CopyOnWriteArrayList<>();
  private final Logger logger = LoggerFactory.getLogger(EventEmitter.class);
  private List<?> dataList = new CopyOnWriteArrayList<>();

  public static final String DEFAULT_EVENT_NAME = "sse_message";

  public SseEmitter add(SseEmitter emitter) {
    this.emitterList.add(emitter);
    emitter.onCompletion(() -> {
      logger.info("onCompletion emitter : {}", emitter.toString());
    });

    emitter.onTimeout(() -> {
      logger.info("onTimeout emitter : {}", emitter.toString());
      this.emitterList.remove(emitter);
    });

    return emitter;
  }

  public List<String> getEmitterList() {
    List<String> ret = new ArrayList<String>();
    emitterList.forEach(emitter -> {
      ret.add(emitter.toString());
    });
    return ret;
  }

  public void checkEmitterStatus() {
    emitterList.forEach(emitter -> {
      emitter.onCompletion(() -> {
        logger.info("onCompletion emitter : {}", emitter.toString());
        emitterList.remove(emitter);
      });
      emitter.onTimeout(() -> {
        logger.info("onTimeout emitter : {}", emitter.toString());
        emitterList.remove(emitter);
      });
    });
  }

  public void sendData(List<?> dataList, String eventName) {
    this.dataList = dataList;
    emitterList.forEach(emitter -> {
      try {
        emitter.send(SseEmitter.event().name(eventName).data(dataList));
      } catch (Exception e) {
        logger.error("Error sending data to emitter : {}", e.getMessage());
        emitterList.remove(emitter);
      }
    });
  }

  public void connectAndSendExistData(SseEmitter emitter, String eventName) {
    try {
      boolean existRetryList = false;
      if (dataList != null && !dataList.isEmpty()) {
        existRetryList = true;
      }
      if (existRetryList) {
        emitter.send(SseEmitter.event().name(eventName).data(dataList));
      } else {
        emitter.send(SseEmitter.event().name(eventName).data(HttpStatus.OK));
      }
    } catch (Exception e) {
      logger.error("Error sending data to emitter : {}", e.getMessage());
      emitterList.remove(emitter);
    }
  }
  
}
