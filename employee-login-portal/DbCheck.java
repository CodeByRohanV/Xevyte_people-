import java.sql.*;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/employee_login_db";
        String user = "root";
        String password = "Laya@123";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Goal Templates:");
            String sql = "SELECT id, template_name, department FROM performance_goal_templates";
            try (ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    System.out.printf("Tpl ID: %d | Name: %s | Dept: %s%n",
                            rs.getInt("id"),
                            rs.getString("template_name"),
                            rs.getString("department"));
                }
            }
            
            System.out.println("\nTemplate Goals:");
            sql = "SELECT id, template_id, goal_title, metric, target FROM performance_goal_template_goals";
            try (ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    System.out.printf("Goal ID: %d | Tpl ID: %d | Title: %s | Metric: %s | Target: %s%n",
                            rs.getInt("id"),
                            rs.getInt("template_id"),
                            rs.getString("goal_title"),
                            rs.getString("metric"),
                            rs.getString("target"));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
