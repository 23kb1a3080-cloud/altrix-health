import type { Patient, Observation, MedicationStatement, Condition } from '../types.js'

export function buildFHIRPatient(patient: Patient) {
  return {
    resourceType: 'Patient',
    id: patient.id,
    identifier: [
      ...(patient.abha_number
        ? [
            {
              system: 'https://healthid.ndhm.gov.in',
              value: patient.abha_number,
              type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }] },
            },
          ]
        : []),
    ],
    name: [{ text: patient.name }],
    gender: (patient.sex || 'unknown').toLowerCase(),
    birthDate: patient.dob || '1972-06-15',
  }
}

export function buildFHIRObservation(obs: Observation, patientId: string) {
  return {
    resourceType: 'Observation',
    id: obs.id,
    status: 'final',
    code: {
      coding: [
        ...(obs.loinc_code
          ? [{ system: 'http://loinc.org', code: obs.loinc_code, display: obs.test_name }]
          : []),
      ],
      text: obs.test_name,
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: obs.sample_date || new Date().toISOString(),
    valueQuantity:
      obs.value_numeric !== undefined
        ? { value: obs.value_numeric, unit: obs.unit || '' }
        : undefined,
    valueString: obs.value_numeric === undefined ? obs.value_text : undefined,
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: obs.flag === 'NORMAL' ? 'N' : obs.flag.includes('HIGH') ? 'H' : 'L',
            display: obs.flag,
          },
        ],
      },
    ],
  }
}

export function buildFHIRMedicationStatement(med: MedicationStatement, patientId: string) {
  return {
    resourceType: 'MedicationStatement',
    id: med.id,
    status: 'active',
    medicationCodeableConcept: {
      text: med.name_as_written,
    },
    subject: { reference: `Patient/${patientId}` },
    dosage: [
      {
        text: med.instructions || med.frequency_raw || 'As directed',
      },
    ],
  }
}

export function buildFHIRCondition(cond: Condition, patientId: string) {
  return {
    resourceType: 'Condition',
    id: cond.id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: cond.clinicalStatus || 'active',
        },
      ],
    },
    code: {
      text: cond.name,
      coding: [
        ...(cond.icd10_hint
          ? [{ system: 'http://hl7.org/fhir/sid/icd-10', code: cond.icd10_hint, display: cond.name }]
          : []),
      ],
    },
    subject: { reference: `Patient/${patientId}` },
  }
}

export function buildPatientFHIRBundle(
  patient: Patient,
  observations: Observation[] = [],
  medications: MedicationStatement[] = [],
  conditions: Condition[] = []
) {
  const entries: any[] = []

  // Add Patient
  const patientRes = buildFHIRPatient(patient)
  entries.push({ fullUrl: `urn:uuid:${patient.id}`, resource: patientRes })

  // Add Conditions
  for (const cond of conditions) {
    const cRes = buildFHIRCondition(cond, patient.id)
    entries.push({ fullUrl: `urn:uuid:${cond.id}`, resource: cRes })
  }

  // Add Medications
  for (const med of medications) {
    const mRes = buildFHIRMedicationStatement(med, patient.id)
    entries.push({ fullUrl: `urn:uuid:${med.id}`, resource: mRes })
  }

  // Add Observations
  for (const obs of observations) {
    const oRes = buildFHIRObservation(obs, patient.id)
    entries.push({ fullUrl: `urn:uuid:${obs.id}`, resource: oRes })
  }

  return {
    resourceType: 'Bundle',
    id: `bundle-patient-${patient.id}`,
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  }
}
