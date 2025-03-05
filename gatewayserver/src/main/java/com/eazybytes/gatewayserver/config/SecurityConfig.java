package com.eazybytes.gatewayserver.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;

import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {
  @Bean
  public SecurityWebFilterChain springSecurityWebFilterChain(ServerHttpSecurity serverHttpSecurity) {
    serverHttpSecurity.authorizeExchange(exchanges -> exchanges.pathMatchers(HttpMethod.GET).permitAll()
      // .pathMatchers("/mgbank/accounts/**").authenticated()
      // .pathMatchers("/mgbank/cards/**").authenticated()
      // .pathMatchers("/mgbank/loans/**").authenticated())
      .pathMatchers("/mgbank/accounts/**").hasRole("ACCOUNTS")
      .pathMatchers("/mgbank/cards/**").hasRole("CARDS")
      .pathMatchers("/mgbank/loans/**").hasRole("LOANS"))
      .oauth2ResourceServer(oAuth2ResourceServerSpec -> oAuth2ResourceServerSpec
        // .jwt(Customizer.withDefaults()));
        .jwt(jwtSpec -> jwtSpec.jwtAuthenticationConverter(grantedAuthoritiesExtrator())));
    serverHttpSecurity.csrf(csrfSpec -> csrfSpec.disable());
    return serverHttpSecurity.build();
  }

  private Converter<Jwt, Mono<AbstractAuthenticationToken>> grantedAuthoritiesExtrator() {
    JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeyCloackRoleConverter());
    return new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter);
  }
}
