
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface BlogCard {
  tag: string;
  title: string;
  desc: string;
  image: string;
  readTime: string;
  link: string;
}

@Component({
  selector: 'app-blog-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-section.component.html',
  styleUrls: ['./blog-section.component.scss']
})
export class BlogSectionComponent {
  blogs: BlogCard[] = [
    {
      tag: 'Travel route',
      title: 'The ultimate Galle to Ella EV road trip guide',
      desc: `Discover the best charging stops and scenic lookouts on Sri Lanka's most...`,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQieXWMznSJnyDzLOS3ftJ1Gk1PAR7fhF1S7g&s',
      readTime: '5 min read',
      link: '/blog/1'
    },
    {
      tag: 'Partner story',
      title: `How Chamari\'s guesthouse doubled revenue`,
      desc: `A look at how a simple EV charger installation changed the trajectory of a...`,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf41RADkqKuglMfzC41ceRFnsoAPVbBju6nA&s',
      readTime: '4 min read',
      link: '/blog/2'
    },
    {
      tag: 'EV tips',
      title: '5 things to know before your first EV rental',
      desc: `Never driven an electric vehicle before? Here is everything you need to know...`,
      image: 'https://www.e-spincorp.com/wp-content/uploads/2021/09/electric-vehicle-car-ev.jpeg',
      readTime: '3 min read',
      link: '#'
    }
  ];
}
