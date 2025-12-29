import { Store } from './store.model';

export interface Project {
    id?: number;
    storeId: number;
    projectType: string;
    status: string;
    gisCode: string;
    address: string;
    totalArea?: number;
    tradeArea?: number;
    region: string;
    cfo: string;
    mp: string;
    nor: string;
    stMRiZ: string;
    rnr: string;
    createdAt?: string;
    updatedAt?: string;
    store?: Store;
    // BPMN fields
    currentStage?: string;
    templateId?: number;
}

export const PROJECT_TYPES = ['Открытие', 'Реконструкция'];
export const PROJECT_STATUSES = [
    'Создан',
    'Аудит',
    'Бюджет сформирован',
    'Утвержден ИК',
    'Подписан договор',
    'РСР',
    'Открыт',
    'Слетел'
];

export const REGIONS = [
    'Московская область',
    'Ленинградская область',
    'Татарстан',
    'Нижегородская область',
    'Свердловская область'
];

export const CFO_LIST = [
    'Центральный ФО',
    'Северо-Западный ФО',
    'Приволжский ФО',
    'Уральский ФО',
    'Сибирский ФО'
];
