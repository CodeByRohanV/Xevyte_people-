package com.register.example.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    
    String action() default "";
    String module() default "";
    String entityName() default "";
    String description() default "";
    boolean logParameters() default false;
    boolean logResult() default false;
    boolean logException() default true;
}
