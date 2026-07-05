import { Component } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  imports: [MaterialModule, MatExpansionModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

}
