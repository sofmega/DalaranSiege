package com.dalaran.dalarans.controller;

import com.dalaran.dalarans.service.SupabaseStatusService;
import com.dalaran.dalarans.service.SupabaseStatusService.SupabaseStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SupabaseStatusController {

    private final SupabaseStatusService supabaseStatusService;

    public SupabaseStatusController(SupabaseStatusService supabaseStatusService) {
        this.supabaseStatusService = supabaseStatusService;
    }

    @GetMapping("/api/supabase/status")
    public SupabaseStatus status() {
        return supabaseStatusService.checkStatus();
    }
}
