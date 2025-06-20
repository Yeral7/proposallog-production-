import React from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';

const ProjectsOngoingPage = () => {
    return (
        <main>
            <Header />
            <Banner title="Projects Ongoing" />
            <div className="p-4">
                <h2 className="text-2xl font-bold">Content for Projects Ongoing</h2>
                <p>This is where the content for ongoing projects will be displayed.</p>
            </div>
        </main>
    );
};

export default ProjectsOngoingPage;
