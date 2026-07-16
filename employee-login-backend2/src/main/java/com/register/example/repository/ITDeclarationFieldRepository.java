package com.register.example.repository;

import com.register.example.entity.ITDeclarationField;
import com.register.example.entity.ITDeclarationCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import java.util.Optional;

@Repository
public interface ITDeclarationFieldRepository extends JpaRepository<ITDeclarationField, Long> {
    List<ITDeclarationField> findByCardOrderByDisplayOrderAsc(ITDeclarationCard card);
    Optional<ITDeclarationField> findByFieldId(String fieldId);

    @org.springframework.data.jpa.repository.Query("SELECT f FROM ITDeclarationField f WHERE f.fieldId = :fieldId AND f.card.financialYear = :financialYear")
    Optional<ITDeclarationField> findByFieldIdAndFinancialYear(String fieldId, String financialYear);

    @org.springframework.data.jpa.repository.Query("SELECT f FROM ITDeclarationField f WHERE f.card.financialYear = :financialYear")
    List<ITDeclarationField> findAllByFinancialYear(String financialYear);
}
