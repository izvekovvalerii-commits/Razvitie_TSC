import { Injectable } from '@angular/core';
import { ProjectTask } from '../models/task.model';
import { STORE_OPENING_TASKS, BpmnTaskDefinition } from '../config/store-opening-process.config';

@Injectable({
    providedIn: 'root'
})
export class WorkflowService {

    constructor() { }

    /**
     * Returns only the tasks that should be created immediately when a project starts.
     */
    getInitialTasks(projectId: number): ProjectTask[] {
        return STORE_OPENING_TASKS
            .filter(def => def.dependsOn.length === 0)
            .map(def => this.createTaskFromDef(def, projectId));
    }

    /**
     * Determines which new tasks should be created based on the current state of the project.
     * @param projectId The project ID
     * @param currentTasks The list of all tasks currently existing in the DB for this project
     */
    determineNextTasks(projectId: number, currentTasks: ProjectTask[]): ProjectTask[] {
        const existingCodes = new Set(currentTasks.map(t => t.code));
        const completedCodes = new Set(currentTasks.filter(t => t.status === 'Завершена').map(t => t.code));

        const nextTasks: ProjectTask[] = [];

        STORE_OPENING_TASKS.forEach(def => {
            // If task already exists, skip
            if (existingCodes.has(def.code)) return;

            // Check if dependencies are met
            const dependenciesMet = def.dependsOn.every(depCode => completedCodes.has(depCode));

            if (dependenciesMet) {
                // Prepare task
                const newTask = this.createTaskFromDef(def, projectId);

                // Auto-complete ServiceTasks logic could go here
                if (def.type === 'ServiceTask') {
                    newTask.status = 'Завершена';
                }

                nextTasks.push(newTask);
            }
        });

        return nextTasks;
    }

    getCurrentStage(currentTasks: ProjectTask[]): string {
        const active = currentTasks.find(t => t.status === 'Назначена' || t.status === 'В работе');
        if (active && active.stage) return active.stage;

        // If no active task, maybe check the last completed one
        if (currentTasks.length > 0) {
            // Sort by id or createdAt to get last
            // Assuming array is roughly chronological or we trust array order
            const last = currentTasks[currentTasks.length - 1];
            if (last.stage) return last.stage;
        }

        return 'Инициализация';
    }

    private createTaskFromDef(def: BpmnTaskDefinition, projectId: number): ProjectTask {
        return {
            projectId: projectId,
            name: def.name,
            code: def.code,
            taskType: def.type,
            responsible: def.role,
            status: 'Назначена',
            isActive: true,
            stage: def.stage,
            normativeDeadline: new Date(Date.now() + (def.duration || 7) * 24 * 60 * 60 * 1000).toISOString()
        };
    }
}
