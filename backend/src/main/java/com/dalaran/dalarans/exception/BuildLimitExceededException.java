package com.dalaran.dalarans.exception;

public class BuildLimitExceededException extends RuntimeException {

    public BuildLimitExceededException() {
        super("You can create a maximum of 4 builds for this hero. Edit or delete an old build first.");
    }
}
