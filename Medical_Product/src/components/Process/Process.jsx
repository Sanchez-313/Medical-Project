import React from 'react'
import Heading from '../Heading/Heading'
import {
  TbCircleNumber1Filled,
  TbCircleNumber2Filled,
  TbCircleNumber3Filled,
  TbCircleNumber4Filled
} from "react-icons/tb";
import { PiPrescription, PiMicroscope } from "react-icons/pi";
import { MdOutlineVerifiedUser, MdOutlineLocalPharmacy } from 'react-icons/md';

const steps = [
    {
        id: 1,
        number: <TbCircleNumber1Filled />,
        title: 'Procurement',
        para: 'Sourcing authentic English and Myanmar medicines from licensed manufacturers.',
        icon: <PiPrescription />,
    },
    {
        id: 2,
        number: <TbCircleNumber2Filled />,
        title: 'Lab Inspection',
        para: 'Rigorous chemical analysis and stability testing to ensure ingredient purity.',
        icon: <PiMicroscope />,
    },
    {
        id: 3,
        number: <TbCircleNumber3Filled />,
        title: 'FDA Compliance',
        para: 'Strict adherence to medical regulations and Good Storage Practices (GSP).',
        icon: <MdOutlineVerifiedUser />,
    },
    {
        id: 4,
        number: <TbCircleNumber4Filled />,
        title: 'Safe Dispensing',
        para: 'Temperature-controlled logistics and secure delivery to your local pharmacy.',
        icon: <MdOutlineLocalPharmacy />,
    }
]

const Process = () => {
    const renderSteps = steps.map(item => {
        return (
            <div key={item.id} className={`flex-1 basis-[300px] ${item.id % 2 === 0 ? 'md:-mt-100' : ''}`}>
                <span className='flex justify-center items-center rounded-full w-18 h-18 mx-auto text-7xl bg-blue-900 text-white outline-[3px] outline-offset-7 outline-blue-900 outline-dashed shadow-xl'>
                    {item.number}
                </span>
                
                <div className='flex items-center gap-x-5 mt-10'>
                    <span className='flex justify-center items-center text-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white w-15 h-15 rounded-2xl rotate-3 shadow-md'>
                        <span className="-rotate-3">{item.icon}</span>
                    </span>

                    <div className='flex-1'>
                        <h4 className='text-zinc-800 text-2xl font-bold'>{item.title}</h4>
                        <p className='text-zinc-500 mt-2 text-sm leading-relaxed'>{item.para}</p>
                    </div>
                </div>
            </div>
        )
    })

    return (
        <section className="bg-zinc-50">
            <div className="max-w-[1400px] mx-auto px-10 py-20">
                <div className="w-fit mr-auto">
                    <Heading highlight="Workflow" heading="Reliability" />
                </div>
                <div className="flex flex-wrap gap-y-17 items-center justify-center md:mt-20 mt-10 md:pt-50">
                    {renderSteps}
                </div>
            </div>
        </section>
    )
}

export default Process;