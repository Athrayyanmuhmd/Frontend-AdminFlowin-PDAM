import { gql } from '@apollo/client';

/**
 * Survei-related mutations
 * 
 * NOTE: assignTeknisiSurvei, assignTeknisiRAB, dan aktivasiPelanggan
 * TIDAK ADA di backend schema. Fungsi assign teknisi dilakukan melalui
 * WorkOrder system (buatWorkOrder + reviewTim).
 * 
 * Mutations untuk CRUD survei ada di queries/surveyData.ts
 * (CREATE_SURVEI, UPDATE_SURVEI, DELETE_SURVEI)
 */

// File ini sengaja dikosongkan karena mutation-mutation sebelumnya
// tidak ada di backend GraphQL schema.
// Gunakan WorkOrder mutations untuk assign teknisi ke survei/RAB.
