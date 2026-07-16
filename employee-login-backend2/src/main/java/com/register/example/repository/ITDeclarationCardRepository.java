package com.register.example.repository;

import com.register.example.entity.ITDeclarationCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ITDeclarationCardRepository extends JpaRepository<ITDeclarationCard, Long> {
    List<ITDeclarationCard> findAllByActiveOrderByDisplayOrderAsc(Boolean active);

    List<ITDeclarationCard> findAllByOrderByDisplayOrderAsc();

    List<ITDeclarationCard> findAllByFinancialYearOrderByDisplayOrderAsc(String financialYear);

    List<ITDeclarationCard> findAllByFinancialYearAndActiveOrderByDisplayOrderAsc(String financialYear, Boolean active);
    
    List<ITDeclarationCard> findAllByFinancialYearIsNullOrderByDisplayOrderAsc();

    List<ITDeclarationCard> findAllByFinancialYearIsNullAndActiveOrderByDisplayOrderAsc(Boolean active);
}
