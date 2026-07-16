package com.register.example.service;

import com.register.example.entity.ITDeclarationField;
import com.register.example.entity.ITDeclarationCard;
import com.register.example.repository.ITDeclarationFieldRepository;
import com.register.example.repository.ITDeclarationCardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ITDeclarationFieldService {

    @Autowired
    private ITDeclarationFieldRepository repository;

    @Autowired
    private ITDeclarationCardRepository cardRepository;

    public List<ITDeclarationField> getFieldsByCard(Long cardId) {
        ITDeclarationCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        return repository.findByCardOrderByDisplayOrderAsc(card);
    }

    public ITDeclarationField saveField(ITDeclarationField field, Long cardId) {
        ITDeclarationCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));
        field.setCard(card);
        return repository.save(field);
    }

    public void deleteField(Long id) {
        repository.deleteById(id);
    }

    public List<ITDeclarationField> getAllFields(String financialYear) {
        if (financialYear != null && !financialYear.isEmpty()) {
            return repository.findAllByFinancialYear(financialYear);
        }
        return repository.findAll();
    }
}
