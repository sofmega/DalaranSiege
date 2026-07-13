package com.dalaran.dalarans.exception;

public class CompositionLimitExceededException extends RuntimeException {

    public CompositionLimitExceededException() {
        super("You can create a maximum of 4 compositions. Delete an old composition before creating another one.");
    }
}
