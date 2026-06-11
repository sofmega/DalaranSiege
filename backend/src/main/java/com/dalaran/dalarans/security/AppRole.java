package com.dalaran.dalarans.security;

public enum AppRole {
    USER("user", "ROLE_USER"),
    ADMIN("admin", "ROLE_ADMIN");

    private final String databaseValue;
    private final String authority;

    AppRole(String databaseValue, String authority) {
        this.databaseValue = databaseValue;
        this.authority = authority;
    }

    public String databaseValue() {
        return databaseValue;
    }

    public String authority() {
        return authority;
    }

    public static AppRole fromDatabaseValue(String value) {
        if (ADMIN.databaseValue.equalsIgnoreCase(value)) {
            return ADMIN;
        }

        return USER;
    }
}
