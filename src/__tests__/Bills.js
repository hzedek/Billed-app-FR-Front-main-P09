/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.value).toMatch("active-icon");
        });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });
  describe("Given the bills container is initialized", () => {
    test("When i click on new bill button, form bill modal open", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const store = null
      const billsContainer = new Bills({
        document, onNavigate, store, bills, localStorage: window.localStorage
      })

      const newBillButton = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn(() => billsContainer.handleClickNewBill())

      newBillButton.addEventListener("click", handleClickNewBill)
      fireEvent.click(newBillButton)

      expect(handleClickNewBill).toHaveBeenCalled()

      const formNewBill = screen.queryByTestId("form-new-bill")
      expect(formNewBill).toBeTruthy()
    })

    test("When clicking on icon eye", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })
      
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const store = null
      const billsContainer = new Bills({
        document, onNavigate, store, bills, localStorage: window.localStorage
      })

      const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye.bind(billsContainer))
      const eye = screen.getAllByTestId("icon-eye")[0]

      eye.addEventListener('click', () => handleClickIconEye(eye))
      fireEvent.click(eye)

      expect(handleClickIconEye).toHaveBeenCalled()

      const modale = screen.getByTestId('modaleFile')
      expect(modale).toBeTruthy()
    })
  })
  })
});

// méthode GET API

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to bill list", async () => {
    localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
    
    const root = document.createElement("div")
    root.setAttribute("id", "root")

    document.body.append(root)

    router()

    window.onNavigate(ROUTES_PATH.Bills)

    await waitFor(() => screen.getByText("Validations"))

    const contentPending  = await screen.getByText("En attente (1)")
    expect(contentPending).toBeTruthy()

    const contentRefused  = await screen.getByText("Refusé (2)")
    expect(contentRefused).toBeTruthy()

    expect(screen.getByTestId("big-billed-icon")).toBeTruthy()
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")

      document.body.appendChild(root)
      router()
    })

    test("fetches bill list from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)

      await new Promise(process.nextTick);

      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches bill list from an API and fails 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);

      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})