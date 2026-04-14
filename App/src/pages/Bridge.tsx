import MainLayout from "../components/layout/MainLayout"
import {Outlet} from "react-router-dom"

export default function Bridge() {
    return (
        <MainLayout>
            <div className="mx-auto max-w-6l px-10 py-10">
                <Outlet/>
            </div>
        </MainLayout>
    );
}