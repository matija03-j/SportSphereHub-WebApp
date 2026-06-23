import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;
  isLoggedIn = this.auth.isLoggedIn;
  role = this.auth.role;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
