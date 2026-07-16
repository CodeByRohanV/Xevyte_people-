package com.register.example.repository;
 
import com.register.example.entity.TravelDocument;
import org.springframework.data.jpa.repository.JpaRepository;
 
import java.util.List;
 
public interface TravelDocumentRepository extends JpaRepository<TravelDocument, Long> {
    List<TravelDocument> findByTravelRequestId(Long requestId);
}