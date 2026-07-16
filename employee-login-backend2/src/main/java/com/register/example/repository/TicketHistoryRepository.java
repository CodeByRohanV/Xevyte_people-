package com.register.example.repository;

import com.register.example.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {

    List<TicketHistory> findByTicketIdOrderByTimestampAsc(Long ticketId);

}
