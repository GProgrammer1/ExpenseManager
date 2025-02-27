import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {IonicModule} from '@ionic/angular';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-personalinfo',
  templateUrl: './personalinfo.page.html',
  styleUrls: ['./personalinfo.page.scss'],
  standalone: true,
  imports: [RouterModule, IonicModule, CommonModule, FormsModule],
})
export class PersonalinfoPage {
  monthlyIncome: number | null = null;
  fixedExpenses: { category: string, amount: number }[] = [];
  variableExpenses: { category: string, amount: number }[] = [];
  savingsGoal: number | null = null;
  country: string = '';
  ageRange: string = '';
  hasDebt: boolean = false;
  debtAmount: number | null = null;
  currentStep: number = 1;
  countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (Swaziland)", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
    "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
    "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
    "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan",
    "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
    "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];
  
  constructor(private router: Router, private toastController: ToastController, private authService: AuthService) {}

  addFixedExpense() {
    this.fixedExpenses.push({ category: '', amount: 0 });
  }

  filteredCountries: string[] = [...this.countries]; // Start with all countries
  selectedCountry: string = '';

  filterCountries(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredCountries = this.countries.filter(country =>
      country.toLowerCase().includes(searchTerm)
    );
  }

  saveAndContinue() {
    // Handle saving data and navigate to another page if necessary
    console.log('Saved data:', {
      income: this.monthlyIncome,
      fixedExpenses: this.fixedExpenses,
      variableExpenses: this.variableExpenses,
      savings: this.savingsGoal,
    });

    const userId = localStorage.getItem('userId');

    const userInfo = {
      monthlyIncome: this.monthlyIncome,
      fixedExpenses: this.fixedExpenses,
      variableExpenses: this.variableExpenses,
      savings: this.savingsGoal,
      hasDebt: this.hasDebt,
      country: this.country,
      ageRange: this.ageRange
    
    };

    this.authService.updateUserData(userId!, userInfo);
    this.router.navigate(['/tabs']); // Change to the next page
  }

  addVariableExpense() {
    this.variableExpenses.push({ category: '', amount: 0 });
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  async submitFinancialInfo() {
    // Validate required fields
    if (
      !this.monthlyIncome ||
      !this.savingsGoal ||
      !this.country ||
      !this.ageRange ||
      this.fixedExpenses.length === 0 ||
      this.variableExpenses.length === 0 ||
      this.fixedExpenses.some(exp => !exp.category || exp.amount <= 0) ||
      this.variableExpenses.some(exp => !exp.category || exp.amount <= 0)
    ) {
      this.showToast('Please fill in all required fields and add at least one valid expense for each category.');
      return;
    }

    // Prepare user financial data
    const financialData = {
      monthlyIncome: this.monthlyIncome,
      fixedExpenses: this.fixedExpenses,
      variableExpenses: this.variableExpenses,
      savingsGoal: this.savingsGoal,
      country: this.country,
      ageRange: this.ageRange,
      hasDebt: this.hasDebt,
    };

    console.log('User Financial Info:', financialData);
    
    // Navigate to the next step (or save to API if needed)
    this.router.navigate(['/dashboard']); // Adjust the route as needed
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }

  removeFixedExpense(index: number) {
    this.fixedExpenses.splice(index, 1);
  }

  removeVariableExpense(index: number) {
    this.variableExpenses.splice(index, 1);
  }
}