package com.register.example.service;

import com.register.example.entity.ITDeclarationCard;
import com.register.example.entity.ITDeclarationField;
import com.register.example.repository.ITDeclarationCardRepository;
import com.register.example.repository.ITDeclarationFieldRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ITDeclarationCardService {

    @Autowired
    private ITDeclarationCardRepository repository;

    @Autowired
    private ITDeclarationFieldRepository fieldRepository;

    @PostConstruct
    public void seedInitialCards() {
        // Hardcoded cards removed by user request.
        // Initial cards can be added via the Admin Management UI.
    }

    public List<ITDeclarationCard> getAllActiveCards(String financialYear) {
        if (financialYear != null && !financialYear.trim().isEmpty()) {
            System.out.println("[DEBUG] Fetching ACTIVE cards for FY: " + financialYear);
            return repository.findAllByFinancialYearAndActiveOrderByDisplayOrderAsc(financialYear, true);
        }
        System.out.println("[DEBUG] Fetching GLOBAL ACTIVE cards (FY IS NULL)");
        return repository.findAllByFinancialYearIsNullAndActiveOrderByDisplayOrderAsc(true);
    }

    public List<ITDeclarationCard> getAllCards(String financialYear) {
        if (financialYear != null && !financialYear.trim().isEmpty()) {
            System.out.println("[DEBUG] Fetching ALL cards for FY: " + financialYear);
            return repository.findAllByFinancialYearOrderByDisplayOrderAsc(financialYear);
        }
        System.out.println("[DEBUG] Fetching GLOBAL ALL cards (FY IS NULL)");
        return repository.findAllByFinancialYearIsNullOrderByDisplayOrderAsc();
    }

    public List<ITDeclarationCard> getAllCardsAbsolute() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    public void cloneConfiguration(String fromYear, String toYear) {
        List<ITDeclarationCard> sourceCards = repository.findAllByFinancialYearOrderByDisplayOrderAsc(fromYear);
        for (ITDeclarationCard sourceCard : sourceCards) {
            ITDeclarationCard newCard = new ITDeclarationCard();
            newCard.setTitle(sourceCard.getTitle());
            newCard.setDescription(sourceCard.getDescription());
            newCard.setIconName(sourceCard.getIconName());
            newCard.setActive(sourceCard.getActive());
            newCard.setDisplayOrder(sourceCard.getDisplayOrder());
            newCard.setMultipleAllowed(sourceCard.getMultipleAllowed());
            newCard.setMaxEntries(sourceCard.getMaxEntries());
            newCard.setFinancialYear(toYear);

            ITDeclarationCard savedCard = repository.save(newCard);

            // Clone fields
            List<ITDeclarationField> sourceFields = fieldRepository.findByCardOrderByDisplayOrderAsc(sourceCard);
            for (ITDeclarationField sourceField : sourceFields) {
                ITDeclarationField newField = new ITDeclarationField();
                newField.setCard(savedCard);
                newField.setFieldId(sourceField.getFieldId());
                newField.setFieldLabel(sourceField.getFieldLabel());
                newField.setDataType(sourceField.getDataType());
                newField.setPlaceholder(sourceField.getPlaceholder());
                newField.setRequired(sourceField.getRequired());
                newField.setValidationRules(sourceField.getValidationRules());
                newField.setDropdownOptions(sourceField.getDropdownOptions());
                newField.setDisplayOrder(sourceField.getDisplayOrder());
                newField.setMaxLimit(sourceField.getMaxLimit());
                fieldRepository.save(newField);
            }
        }
    }

    public ITDeclarationCard saveOrUpdateCard(ITDeclarationCard card) {
        return repository.save(card);
    }

    public void deleteCard(Long id) {
        repository.deleteById(id);
    }

    public Optional<ITDeclarationCard> getCardById(Long id) {
        return repository.findById(id);
    }

}
