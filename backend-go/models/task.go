package models

import (
	"time"
)

type ProjectTask struct {
	ID                uint       `gorm:"column:Id;primaryKey" json:"id"`
	ProjectID         uint       `gorm:"column:ProjectId;not null" json:"projectId" binding:"required"`
	Name              string     `gorm:"column:Name;type:varchar(255);not null" json:"name" binding:"required"`
	TaskType          string     `gorm:"column:TaskType;type:varchar(100)" json:"taskType"`
	Responsible       string     `gorm:"column:Responsible;type:varchar(255)" json:"responsible"`
	ResponsibleUserID *int       `gorm:"column:ResponsibleUserId" json:"responsibleUserId"`
	NormativeDeadline time.Time  `gorm:"column:NormativeDeadline;not null" json:"normativeDeadline" binding:"required"`
	ActualDate        *time.Time `gorm:"column:ActualDate" json:"actualDate"`
	Status            string     `gorm:"column:Status;type:varchar(50);default:'Назначена'" json:"status"`
	CreatedAt         *time.Time `gorm:"column:CreatedAt" json:"createdAt"`
	UpdatedAt         *time.Time `gorm:"column:UpdatedAt" json:"updatedAt"`
	StartedAt         *time.Time `gorm:"column:StartedAt" json:"startedAt"`
	CompletedAt       *time.Time `gorm:"column:CompletedAt" json:"completedAt"`
	Code              *string    `gorm:"column:Code;type:varchar(50)" json:"code"`
	IsActive          bool       `gorm:"column:IsActive;default:false" json:"isActive"`
	Stage             *string    `gorm:"column:Stage;type:varchar(100)" json:"stage"`
	PlannedAuditDate  *time.Time `gorm:"column:PlannedAuditDate" json:"plannedAuditDate"`
	ProjectFolderLink *string    `gorm:"column:ProjectFolderLink;type:text" json:"projectFolderLink"`
	ActualAuditDate   *time.Time `gorm:"column:ActualAuditDate" json:"actualAuditDate"`
	Project           *Project   `gorm:"foreignKey:ProjectId;references:Id" json:"project,omitempty"`
}

func (ProjectTask) TableName() string {
	return "ProjectTasks"
}
