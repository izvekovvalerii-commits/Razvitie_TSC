package models

import (
	"time"
)

type Project struct {
	ID          uint       `gorm:"column:Id;primaryKey" json:"id"`
	StoreID     uint       `gorm:"column:StoreId;not null" json:"storeId" binding:"required"`
	ProjectType string     `gorm:"column:ProjectType;type:varchar(50);not null" json:"projectType" binding:"required"`
	Status      string     `gorm:"column:Status;type:varchar(50);default:'Создан'" json:"status"`
	GISCode     string     `gorm:"column:GisCode;type:varchar(50)" json:"gisCode"`
	Address     string     `gorm:"column:Address;type:text" json:"address"`
	TotalArea   *float64   `gorm:"column:TotalArea" json:"totalArea"`
	TradeArea   *float64   `gorm:"column:TradeArea" json:"tradeArea"`
	Region      string     `gorm:"column:Region;type:varchar(100)" json:"region"`
	CFO         string     `gorm:"column:CFO;type:varchar(100)" json:"cfo"`
	MP          string     `gorm:"column:MP;type:varchar(255)" json:"mp"`
	NOR         string     `gorm:"column:NOR;type:varchar(255)" json:"nor"`
	StMRiZ      string     `gorm:"column:StMRiZ;type:varchar(255)" json:"stMRiZ"`
	RNR         string     `gorm:"column:RNR;type:varchar(255)" json:"rnr"`
	CreatedAt   time.Time  `gorm:"column:CreatedAt" json:"createdAt"`
	UpdatedAt   *time.Time `gorm:"column:UpdatedAt" json:"updatedAt"`
	Store       *Store     `gorm:"foreignKey:StoreId;references:Id" json:"store,omitempty"`
}

func (Project) TableName() string {
	return "Projects"
}
