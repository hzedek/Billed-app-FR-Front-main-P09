import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
  
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
      // Liste des types de fichiers acceptés
      const acceptedTypes = ['image/jpeg', 'image/png','image/jpg'];
      // Vérifier si le type de fichier est accepté
      if (acceptedTypes.includes(file.type)) {
        fileInput.setAttribute('data-error', '')
        fileInput.setAttribute('data-error-visible', 'false')
        console.log('Fichier accepté. Type de fichier:', file.type);
        const filePath = e.target.value.split(/\\/g)
        const fileName = filePath[filePath.length-1]
        const formData = new FormData()
        const email = JSON.parse(localStorage.getItem("user")).email
        formData.append('file', file)
        formData.append('email', email)
        console.log(fileInput);
        this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .catch(error => console.error(error))
      .then(({fileUrl, key}) => {
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
      } else {
        console.log('Type de fichier non pris en charge. Veuillez sélectionner un fichier JPEG ou PNG.');
        fileInput.setAttribute('data-error', 'Le fichier n\'est pas une image ou a une extension non autorisée.')
        fileInput.setAttribute('data-error-visible', 'true')
        // Ajoutez ici le code pour informer l'utilisateur du type de fichier non pris en charge
        fileInput.value = ""
      }
  }
  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    console.log(bill);

    this.updateBill(bill)
    
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}