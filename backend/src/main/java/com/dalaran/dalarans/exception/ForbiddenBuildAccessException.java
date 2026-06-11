package com.dalaran.dalarans.exception;

public class ForbiddenBuildAccessException extends RuntimeException {

    public ForbiddenBuildAccessException() {
        super("You can only edit or delete your own builds.");
    }
}
