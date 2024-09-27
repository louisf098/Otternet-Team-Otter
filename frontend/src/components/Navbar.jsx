import { useState } from 'react'
import '../stylesheets/navbar.css'

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    <div class="sidebar">
        <ul>
            <li>Dashboard</li>
            <li>Market</li>
            <li>Upload</li>
            <li>Wallet/Mining</li>
        </ul>
    </div>
  }
}