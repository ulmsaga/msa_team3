package com.eazybytes.message.functions;

import com.eazybytes.message.dto.AccountMsgDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Function;

@Configuration
public class MessageFunctions {

    private final Logger logger = LoggerFactory.getLogger(MessageFunctions.class);

    @Bean
    public Function<AccountMsgDto, AccountMsgDto> email() {
        return accountMsgDto -> {
            logger.info("Sending email with the details " + accountMsgDto.toString());
            return accountMsgDto;
        };
    }

    @Bean
    public Function<AccountMsgDto, Long> sms() {
        return accountMsgDto -> {
            logger.info("Sending sms with the details " + accountMsgDto.toString());
            return accountMsgDto.accountNumber();
        };
    }

}
