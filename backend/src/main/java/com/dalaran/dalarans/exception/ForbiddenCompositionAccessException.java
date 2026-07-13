package com.dalaran.dalarans.exception;

public class ForbiddenCompositionAccessException extends RuntimeException {

    public ForbiddenCompositionAccessException() {
        super("You can only delete your own compositions.");
    }
}
