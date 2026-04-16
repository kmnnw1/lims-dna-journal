import ExcelJS from 'exceljs';
import { prisma } from '../database/prisma';
import { ParsedSpecimenRow } from './types';
import { parseSheetToRows } from './sheet-parsers';
import { mergeById } from './merge-utils';
import { Prisma } from '../../prisma/generated/client/client';

export async function processExcelToDatabase(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    // ExcelJS workbook.xlsx.load expects a certain Buffer type, casting to any for compatibility
    await workbook.xlsx.load(buffer as any);

    const results = {
        specimensInserted: 0,
        pcrAttemptsCreated: 0,
        errors: 0,
        logs: [] as string[],
    };

    let allParsedRows: ParsedSpecimenRow[] = [];
    workbook.worksheets.forEach((sheet) => {
        const rows = parseSheetToRows(sheet, sheet.name);
        allParsedRows = allParsedRows.concat(rows);
    });

    const mergedRows = mergeById(allParsedRows);

    await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            for (const row of mergedRows) {
                try {
                    const importNotesObj: Record<string, string> = {};

                    if (row.notes) importNotesObj.generalNotes = row.notes;

                    if (!row.extrDate && row.extrDateRaw) {
                        importNotesObj.unparsedExtrDate = row.extrDateRaw;
                    }

                    const notesValue = Object.keys(importNotesObj).length > 0 ? JSON.stringify(importNotesObj) : null;

                    const specimen = await tx.specimen.upsert({
                        where: { id: row.id },
                        update: {
                            taxon: row.taxon || null,
                            locality: row.locality || null,
                            collector: row.collector || null,
                            extrLab: row.extrLab || null,
                            extrOperator: row.extrOperator || null,
                            extrMethod: row.extrMethod || null,
                            extrDate: row.extrDate || null,
                            notes: notesValue,
                        },
                        create: {
                            id: row.id,
                            taxon: row.taxon || null,
                            locality: row.locality || null,
                            collector: row.collector || null,
                            extrLab: row.extrLab || null,
                            extrOperator: row.extrOperator || null,
                            extrMethod: row.extrMethod || null,
                            extrDate: row.extrDate || null,
                            notes: notesValue,
                        },
                    });

                    results.specimensInserted++;

                    // Создаем PCR attempts для каждого маркера
                    const markers = [
                        { status: row.itsStatus, gb: row.itsGb, type: 'ITS' },
                        { status: row.ssuStatus, gb: row.ssuGb, type: 'SSU' },
                        { status: row.lsuStatus, gb: row.lsuGb, type: 'LSU' },
                        { status: row.mcm7Status, gb: row.mcm7Gb, type: 'MCM7' },
                    ];

                    for (const marker of markers) {
                        if (marker.status || marker.gb) {
                            await tx.pcrAttempt.create({
                                data: {
                                    specimenId: specimen.id,
                                    marker: marker.type,
                                    result: marker.status || 'Unknown',
                                    resultNotes: marker.gb ? `GenBank: ${marker.gb}` : null,
                                },
                            });

                            results.pcrAttemptsCreated++;
                        }
                    }
                } catch (error) {
                    results.errors++;
                    results.logs.push(`Error processing row ${row.id}: ${error}`);
                }
            }
        },
    );

    return results;
}
