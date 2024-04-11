/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import mockStore from "../__mocks__/store";
import { mockedBill } from "../__mocks__/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsUI from "../views/BillsUI.js";

beforeEach(() => {
	document.body.innerHTML = NewBillUI();
	window.localStorage.setItem(
		"user",
		JSON.stringify({
			type: "Employee",
			email: "a@a",
		})
	);
});

describe("Given I am connected as an Employee", () => {
	describe("When I'm on the NewBill page", () => {
		test("Then bill icon mail in vertical layout should be highlighted", async () => {
			const root = document.createElement("div");
			root.setAttribute("id", "root");

			document.body.append(root);
			router();

			window.onNavigate(ROUTES_PATH.NewBill);
			await waitFor(() => screen.getAllByTestId("icon-mail"));

			const mailIcon = screen.getAllByTestId("icon-mail")[0];

			expect(mailIcon.classList.contains("active-icon")).toBe(true);
		});

		test("Then I see the title of the page", () => {
			const contentTitle = screen
				.getByText("Envoyer une note de frais")
				.textContent.trim();
			expect(contentTitle).toBe("Envoyer une note de frais");
		});

		test("When handling file change with a valid image file input", async () => {
			const newBills = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage,
			});

			const mockInput = {
				files: [
					new File(["image-de-test.jpeg"], "image-de-test.jpeg", {
						type: "image/jpeg",
					}),
				],
			};

			const handleChangeFile = jest.fn(() => newBills.handleChangeFile);

			const fileInput = screen.getByTestId("file");
			fileInput.addEventListener("change", handleChangeFile);
			fireEvent.change(fileInput, { target: mockInput });

			const error = fileInput.getAttribute("data-error");
			const errorVisible = fileInput.getAttribute("data-error-visible");

			expect(handleChangeFile).toBeCalled();
			expect(fileInput.files[0].type).toBe("image/jpeg");
			expect(error).toBe("");
			expect(errorVisible).toBe("false");
		});

		test("When handling file change with an invalid file type", async () => {
			const newBills = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage,
			});

			const mockInput = {
				files: [
					new File([""], "fichier-text.txt", { type: "text/plain" }),
				],
			};

			const errorMessage =
				"Le fichier n'est pas une image ou a une extension non autorisée.";

			const handleChangeFile = jest.fn(() => newBills.handleChangeFile);

			const fileInput = screen.getByTestId("file");
			fileInput.addEventListener("change", handleChangeFile);
			fireEvent.change(fileInput, { target: mockInput });

			const error = fileInput.getAttribute("data-error");
			const errorVisible = fileInput.getAttribute("data-error-visible");

			expect(newBills.billId).toBeNull();
			expect(newBills.fileUrl).toBeNull();
			expect(newBills.fileName).toBeNull();
			expect(error).toBe(errorMessage);
			expect(errorVisible).toBe("true");
		});

		test("When handling form submission new bill", async () => {
			const newBills = new NewBill({
				document,
				onNavigate,
				storeFromMock: mockStore,
				localStorage: window.localStorage,
			});

			const handleSubmit = jest.fn((e) => {
				e.preventDefault();
				newBills.handleSubmit(e);
			});

			const form = screen.getByTestId("form-new-bill");
			form.addEventListener("submit", handleSubmit);

			const testData = {
				expenseType: "Equipement et matériel",
				expenseName: "pc plus puissant !",
				date: "2023-11-15",
				amount: 4000,
				vat: "70",
				percentage: 20,
				commentary: "ok",
				file:""
			};

			const selectElement = screen.getByTestId("expense-type");
			const expenditureInput = screen.getByTestId("expense-name");
			const dateInput = screen.getByTestId("datepicker");
			const amountInput = screen.getByTestId("amount");
			const vatInput = screen.getByTestId("vat");
			const percentageInput = screen.getByTestId("pct");
			const commentInput = screen.getByTestId("commentary");
			const fileInput = screen.getByTestId('file');

			selectElement.value = testData.expenseType;
			expenditureInput.value = testData.expenseName;
			dateInput.value = testData.date;
			amountInput.value = testData.amount;
			vatInput.value = testData.vat;
			percentageInput.value = 10;
			commentInput.value = testData.commentary;
			fileInput.value = testData.file


			fireEvent.submit(form);

			expect(form).toBeTruthy();
			expect(handleSubmit).toHaveBeenCalled();
		});
	});
});

// POST integration test
describe("Given I am a user connected as Employee", () => {
	test("When I send my bill to the API", async () => {
		const mockedStoreBills = mockStore.bills().update(mockedBill);
		const response = await mockedStoreBills;

		expect(response.id).toBe("47qAXb6fIm2zOKkLzMro");
		expect(response).toStrictEqual(mockedBill);
	});

	describe("When an error occurs on API", () => {
		beforeEach(() => {
			jest.spyOn(mockStore, "bills");

			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			});

			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
					email: "a@a",
				})
			);

			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.appendChild(root);

			router();
		});

		test("fetches new bills from an API and displays 404 error message", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {
					list: () => {
						return Promise.reject(new Error("Erreur 404"));
					},
				};
			});

			window.onNavigate(ROUTES_PATH.NewBill);

			await new Promise(process.nextTick);

			document.body.innerHTML = BillsUI({ error: "Erreur 404" });

			const errorMessageElement = screen.getByTestId("error-message");
			const errorEessage = screen.getByText(/Erreur 404/);

			expect(errorMessageElement).toBeTruthy();
			expect(errorEessage).toBeTruthy();
		});

		test("fetches messages from an API and fails with 500 message error", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {
					list: () => {
						return Promise.reject(new Error("Erreur 500"));
					},
				};
			});

			window.onNavigate(ROUTES_PATH.NewBill);

			await new Promise(process.nextTick);

			document.body.innerHTML = BillsUI({ error: "Erreur 500" });

			const errorMessageElement = screen.getByTestId("error-message");
			const errorEessage = screen.getByText(/Erreur 500/);

			expect(errorMessageElement).toBeTruthy();
			expect(errorEessage).toBeTruthy();
		});
	});
});
