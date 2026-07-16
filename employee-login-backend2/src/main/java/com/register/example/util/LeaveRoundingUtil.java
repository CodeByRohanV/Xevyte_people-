package com.register.example.util;
 
/**
* Utility class for applying leave rounding rules.
*
* Supports three rounding modes:
* - ROUND_UP: Fractions go to next full day, but 0.5 stays as 0.5
* - ROUND_DOWN: Drop fractions, but 0.5 stays as 0.5
* - NO_ROUND: Keep as-is
*/
public class LeaveRoundingUtil {
 
    /**
     * Apply rounding rule to a leave value.
     *
     * @param value The leave value to round
     * @param rule  The rounding rule (ROUND_UP, ROUND_DOWN, NO ROUNDING, NO_ROUND,
     *              NONE)
     * @return The rounded value
     */
    public static double applyRoundingRule(double value, String rule) {
        if (rule == null || rule.isEmpty()) {
            return value;
        }
 
        String normalizedRule = rule.trim().toUpperCase().replace(" ", "_");
 
        if ("ROUND_UP".equals(normalizedRule) || "UP".equals(normalizedRule)) {
            return roundUp(value);
        }
 
        if ("ROUND_DOWN".equals(normalizedRule) || "DOWN".equals(normalizedRule)) {
            return roundDown(value);
        }
 
        // NO_ROUND, NO_ROUNDING, NONE or unknown
        return value;
    }
 
    /**
     * ROUND UP (Ceiling) to the next 0.5 step.
     */
    private static double roundUp(double value) {
        // Step is 0.5 (Standard for half-day policies)
        return Math.ceil(value * 2.0) / 2.0;
    }
 
    /**
     * ROUND DOWN (Floor) to the previous 0.5 step.
     */
    private static double roundDown(double value) {
        // Step is 0.5 (Standard for half-day policies)
        return Math.floor(value * 2.0) / 2.0;
    }
}
 