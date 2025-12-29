import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Snowflake {
    left: number;
    delay: string;
    duration: string;
}

@Component({
    selector: 'app-welcome',
    imports: [CommonModule],
    templateUrl: './welcome.html',
    styleUrl: './welcome.css'
})
export class WelcomeComponent implements OnInit {
    snowflakes: Snowflake[] = [];

    constructor(private router: Router) { }

    ngOnInit() {
        this.generateSnowflakes();
    }

    generateSnowflakes() {
        const snowflakeCount = 50;
        for (let i = 0; i < snowflakeCount; i++) {
            this.snowflakes.push({
                left: Math.random() * 100,
                delay: `${Math.random() * 5}s`,
                duration: `${5 + Math.random() * 10}s`
            });
        }
    }

    onStartClick() {
        this.router.navigate(['/home']);
    }
}
