package com.register.example.dto;

public class RowError {
    private int row;
    private String field;
    private String error;

    public RowError(int row, String field, String error) {
        this.row = row;
        this.field = field;
        this.error = error;
    }

    public int getRow() {
        return row;
    }

    public void setRow(int row) {
        this.row = row;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
