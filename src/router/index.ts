import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Book from '@/views/Book.vue'
import BookEdit from '@/views/BookEdit.vue'
import Node from '@/views/Node.vue'
import NodeEdit from '@/views/NodeEdit.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/book/:bookid',
      name: 'Book',
      component: Book
    },
    {
      path: '/book/:bookid/edit',
      name: 'BookEdit',
      component: BookEdit,
    },
    {
      path: '/book/:bookid/:nodeid',
      name: 'Node',
      component: Node
    },
    {
      path: '/book/:bookid/:nodeid/edit',
      name: 'NodeEdit',
      component: NodeEdit
    }
  ]
})

export default router