package com.register.example.service;
//
import com.register.example.entity.Clearance;
import com.register.example.payload.ClearanceDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.Optional;
//
public interface ClearanceService {
//
    Clearance createOrUpdateClearance(
            Long resignationId,
            ClearanceDto dto,
            MultipartFile hrFile,
            MultipartFile adminFile,
            String actorId
    );
//
    Optional<Clearance> getByResignationId(Long resignationId);
}
