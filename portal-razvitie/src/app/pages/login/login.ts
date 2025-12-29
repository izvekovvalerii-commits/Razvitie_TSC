import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './login.html',
    styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
    users: User[] = [];
    returnUrl: string = '/';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        // If already logged in, redirect
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/']);
        }

        // Get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        // Load mock users for quick login
        this.users = this.authService.getMockUsers();
    }

    quickLogin(userId: number) {
        if (this.authService.login(userId)) {
            this.router.navigate([this.returnUrl]);
        }
    }

    getRoleColor(role: string): string {
        const colors: { [key: string]: string } = {
            'МП': '#42A5F5',
            'МРиЗ': '#66BB6A',
            'БА': '#FFA726'
        };
        return colors[role] || '#999';
    }

    getRoleIcon(role: string): string {
        const icons: { [key: string]: string } = {
            'МП': '🔍',
            'МРиЗ': '📊',
            'БА': '⚙️'
        };
        return icons[role] || '👤';
    }
}
