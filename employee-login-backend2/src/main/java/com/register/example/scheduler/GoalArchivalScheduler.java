package com.register.example.scheduler;

import com.register.example.entity.PerformanceGoal;
import com.register.example.repository.PerformanceGoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler to automatically archive completed goals to Goal History
 * on June 30 at 11:59 PM and December 31 at 11:59 PM
 */
@Component
public class GoalArchivalScheduler {

    @Autowired
    private PerformanceGoalRepository goalRepository;

    /**
     * Runs every day at 11:59 PM to check if it's June 30 or December 31
     * Archives all completed goals (status: "approved", "reviewed", "submitted") to
     * history
     */
    @Scheduled(cron = "0 59 23 * * ?", zone = "Asia/Kolkata") // Runs at 11:59 PM every day
    public void archiveCompletedGoals() {
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        int month = today.getMonthValue();
        int day = today.getDayOfMonth();

        // Check if today is June 30 or December 31
        if ((month == 6 && day == 30) || (month == 12 && day == 31)) {
            String half = (month == 6) ? "H1" : "H2";
            int year = today.getYear();

            System.out.println("🗓️ Running Goal Archival Scheduler for " + half + " " + year);

            // Find all completed goals that are not yet archived
            List<PerformanceGoal> completedGoals = goalRepository.findByStatusInAndIsArchived(
                    List.of("approved", "reviewed", "submitted"), false);

            if (completedGoals.isEmpty()) {
                System.out.println("✅ No completed goals to archive.");
                return;
            }

            Date archivalDate = Date.valueOf(today);

            // Archive each completed goal
            for (PerformanceGoal goal : completedGoals) {
                goal.setArchived(true);
                goal.setArchivedDate(archivalDate);
                goal.setArchivedHalf(half + " " + year); // e.g., "H1 2026" or "H2 2026"
                goalRepository.save(goal);
            }

            System.out.println("✅ Successfully archived " + completedGoals.size() +
                    " completed goals to " + half + " " + year + " history.");
        }
    }

    /**
     * Manual trigger for testing purposes
     * Can be called via API endpoint if needed
     */
    public void manualArchive(String half, int year) {
        LocalDate archivalDate = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

        System.out.println("🔧 Manual Goal Archival triggered for " + half + " " + year);

        List<PerformanceGoal> completedGoals = goalRepository.findByStatusInAndIsArchived(
                List.of("approved", "reviewed", "submitted"), false);

        if (completedGoals.isEmpty()) {
            System.out.println("✅ No completed goals to archive.");
            return;
        }

        Date sqlDate = Date.valueOf(archivalDate);

        for (PerformanceGoal goal : completedGoals) {
            goal.setArchived(true);
            goal.setArchivedDate(sqlDate);
            goal.setArchivedHalf(half + " " + year);
            goalRepository.save(goal);
        }

        System.out.println("✅ Manually archived " + completedGoals.size() +
                " completed goals to " + half + " " + year + " history.");
    }
}
