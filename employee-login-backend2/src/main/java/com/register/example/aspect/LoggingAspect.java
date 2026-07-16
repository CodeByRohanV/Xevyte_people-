package com.register.example.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

import java.util.Arrays;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    /**
     * Pointcut that matches all repositories, services and Web REST endpoints.
     */
    @Pointcut("within(@org.springframework.stereotype.Repository *)" +
        " || within(@org.springframework.stereotype.Service *)" +
        " || within(@org.springframework.web.bind.annotation.RestController *)")
    public void springBeanPointcut() {
        // Method is empty as this is just a Pointcut, the implementations are in the advices.
    }

    /**
     * Pointcut that matches all beans in application's main packages.
     */
    @Pointcut("within(com.register.example.controller..*)" +
        " || within(com.register.example.service..*)" +
        " || within(com.register.example.repository..*)")
    public void applicationPackagePointcut() {
        // Method is empty as this is just a Pointcut, the implementations are in the advices.
    }

    /**
     * Advice that logs methods throwing exceptions.
     *
     * @param joinPoint join point for advice
     * @param e exception
     */
    @Around("applicationPackagePointcut() && springBeanPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        
        // Redact sensitive information
        String argsString = redactSensitiveArgs(methodName, args);
        
        if (logger.isDebugEnabled()) {
            logger.debug("Enter: {}.{}() with argument[s] = {}", className, methodName, argsString);
        } else {
            logger.info("Enter: {}.{}()", className, methodName);
        }
        
        final StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        try {
            Object result = joinPoint.proceed();
            stopWatch.stop();
            
            if (logger.isDebugEnabled()) {
                logger.debug("Exit: {}.{}() with result = {}. Execution time: {} ms", className, methodName, result, stopWatch.getTotalTimeMillis());
            } else {
                logger.info("Exit: {}.{}(). Execution time: {} ms", className, methodName, stopWatch.getTotalTimeMillis());
            }
            
            return result;
        } catch (IllegalArgumentException e) {
            logger.error("Illegal argument: {} in {}.{}()", argsString, className, methodName, e);
            throw e;
        } catch (Throwable e) {
            logger.error("Exception in {}.{}() with cause = '{}' and exception = '{}'", 
                className, methodName, e.getCause() != null ? e.getCause() : "NULL", e.getMessage(), e);
            throw e;
        }
    }

    private String redactSensitiveArgs(String methodName, Object[] args) {
        if (args == null || args.length == 0) return "[]";
        
        String methodNameLower = methodName.toLowerCase();
        if (methodNameLower.contains("login") || 
            methodNameLower.contains("password") || 
            methodNameLower.contains("auth") ||
            methodNameLower.contains("token") ||
            methodNameLower.contains("secret")) {
            return "[REDACTED FOR SECURITY]";
        }
        
        return Arrays.toString(args);
    }
}
